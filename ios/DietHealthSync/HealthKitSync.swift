import BackgroundTasks
import Foundation
import HealthKit
import Security
import UIKit

enum AppConfiguration {
    static var apiBaseURL: URL? {
        guard
            let value = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String,
            let url = URL(string: value),
            url.scheme == "https",
            url.host != "YOUR-VERCEL-PROJECT.vercel.app"
        else {
            return nil
        }
        return url
    }
}

struct DailyHealthPayload: Codable {
    let date: String
    let weight: Double?
    let bodyFatPercentage: Double?
    let muscleMass: Double?
    let steps: Int?
    let activeCalories: Int?
    let restingCalories: Int?

    var hasValues: Bool {
        weight != nil || bodyFatPercentage != nil || muscleMass != nil || steps != nil || activeCalories != nil || restingCalories != nil
    }
}

private struct PairingRequest: Encodable {
    let code: String
    let deviceName: String
}

private struct PairingResponse: Decodable {
    let deviceToken: String
}

enum SyncError: LocalizedError {
    case missingServerURL
    case invalidServerResponse
    case server(status: Int, message: String)
    case missingDeviceToken

    var errorDescription: String? {
        switch self {
        case .missingServerURL:
            return "API_BASE_URL が TestFlight 用の HTTPS URL に設定されていません。"
        case .invalidServerResponse:
            return "サーバーから正しい応答を受信できませんでした。"
        case let .server(status, message):
            return "サーバーエラー (\(status)): \(message)"
        case .missingDeviceToken:
            return "この iPhone はまだペアリングされていません。"
        }
    }
}

final class KeychainStore {
    private let service = "com.dietdashboard.healthsync"
    private let account = "mobile-device-token"

    func token() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data
        else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func save(token: String) throws {
        let attributes: [String: Any] = [kSecValueData as String: Data(token.utf8)]
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        let updateStatus = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if updateStatus == errSecItemNotFound {
            var item = query
            item[kSecValueData as String] = Data(token.utf8)
            item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            let addStatus = SecItemAdd(item as CFDictionary, nil)
            guard addStatus == errSecSuccess else { throw KeychainError(status: addStatus) }
        } else if updateStatus != errSecSuccess {
            throw KeychainError(status: updateStatus)
        }
    }

    private struct KeychainError: LocalizedError {
        let status: OSStatus
        var errorDescription: String? { "Keychain への保存に失敗しました (\(status))。" }
    }
}

final class MobileAPIClient {
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func pair(code: String, deviceName: String) async throws -> String {
        let response: PairingResponse = try await send(
            path: "/api/mobile/pair",
            body: PairingRequest(code: code, deviceName: deviceName),
            token: nil
        )
        return response.deviceToken
    }

    func upload(_ payload: DailyHealthPayload, token: String) async throws {
        let _: EmptyResponse = try await send(path: "/api/health", body: payload, token: token)
    }

    private struct EmptyResponse: Decodable {}

    private func send<Body: Encodable, Response: Decodable>(
        path: String,
        body: Body,
        token: String?
    ) async throws -> Response {
        guard let baseURL = AppConfiguration.apiBaseURL else { throw SyncError.missingServerURL }
        guard let url = URL(string: path, relativeTo: baseURL) else { throw SyncError.missingServerURL }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else { throw SyncError.invalidServerResponse }
        guard (200 ..< 300).contains(httpResponse.statusCode) else {
            let message = (try? JSONDecoder().decode(ServerError.self, from: data).error) ?? "送信に失敗しました"
            throw SyncError.server(status: httpResponse.statusCode, message: message)
        }
        return try JSONDecoder().decode(Response.self, from: data)
    }

    private struct ServerError: Decodable { let error: String }
}

final class HealthKitReader {
    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    private let bodyMass = HKQuantityType.quantityType(forIdentifier: .bodyMass)!
    private let bodyFatPercentage = HKQuantityType.quantityType(forIdentifier: .bodyFatPercentage)!
    private let leanBodyMass = HKQuantityType.quantityType(forIdentifier: .leanBodyMass)!
    private let stepCount = HKQuantityType.quantityType(forIdentifier: .stepCount)!
    private let activeEnergy = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
    private let restingEnergy = HKQuantityType.quantityType(forIdentifier: .basalEnergyBurned)!

    private var observedQueries: [HKObserverQuery] = []

    var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    func requestAuthorization() async throws {
        guard isAvailable else { return }
        try await healthStore.requestAuthorization(toShare: [], read: Set(sampleTypes))
    }

    func startObserving() {
        guard observedQueries.isEmpty else { return }
        for type in sampleTypes {
            healthStore.enableBackgroundDelivery(for: type, frequency: .immediate) { _, _ in }
            let query = HKObserverQuery(sampleType: type, predicate: nil) { _, completion, _ in
                SyncScheduler.schedule()
                completion()
            }
            healthStore.execute(query)
            observedQueries.append(query)
        }
    }

    func dailyPayloads(days: Int = 30) async -> [DailyHealthPayload] {
        let today = calendar.startOfDay(for: Date())
        var payloads: [DailyHealthPayload] = []

        for offset in stride(from: days - 1, through: 0, by: -1) {
            guard let day = calendar.date(byAdding: .day, value: -offset, to: today),
                  let end = calendar.date(byAdding: .day, value: 1, to: day)
            else { continue }

            let predicate = HKQuery.predicateForSamples(withStart: day, end: end, options: .strictStartDate)
            async let weight = latestValue(type: bodyMass, unit: .gramUnit(with: .kilo), predicate: predicate)
            async let bodyFat = latestValue(type: bodyFatPercentage, unit: .percent(), predicate: predicate)
            async let leanMass = latestValue(type: leanBodyMass, unit: .gramUnit(with: .kilo), predicate: predicate)
            async let steps = sum(type: stepCount, unit: .count(), predicate: predicate)
            async let active = sum(type: activeEnergy, unit: .kilocalorie(), predicate: predicate)
            async let resting = sum(type: restingEnergy, unit: .kilocalorie(), predicate: predicate)

            let weightValue = await weight
            let bodyFatValue = await bodyFat
            let leanMassValue = await leanMass
            let stepValue = await steps
            let activeValue = await active
            let restingValue = await resting

            let payload = DailyHealthPayload(
                date: dateString(day),
                weight: weightValue,
                bodyFatPercentage: bodyFatValue.map { $0 * 100 },
                muscleMass: leanMassValue,
                steps: stepValue.map { Int($0.rounded()) },
                activeCalories: activeValue.map { Int($0.rounded()) },
                restingCalories: restingValue.map { Int($0.rounded()) }
            )
            if payload.hasValues { payloads.append(payload) }
        }
        return payloads
    }

    private var sampleTypes: [HKQuantityType] {
        [bodyMass, bodyFatPercentage, leanBodyMass, stepCount, activeEnergy, restingEnergy]
    }

    private func latestValue(type: HKQuantityType, unit: HKUnit, predicate: NSPredicate) async -> Double? {
        await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: type,
                predicate: predicate,
                limit: 1,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            ) { _, samples, _ in
                let sample = samples?.first as? HKQuantitySample
                continuation.resume(returning: sample?.quantity.doubleValue(for: unit))
            }
            healthStore.execute(query)
        }
    }

    private func sum(type: HKQuantityType, unit: HKUnit, predicate: NSPredicate) async -> Double? {
        await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, statistics, _ in
                continuation.resume(returning: statistics?.sumQuantity()?.doubleValue(for: unit))
            }
            healthStore.execute(query)
        }
    }

    private func dateString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = calendar.timeZone
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}

enum SyncScheduler {
    static let taskIdentifier = "com.dietdashboard.healthsync.refresh"

    static func register() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: taskIdentifier, using: nil) { task in
            guard let task = task as? BGProcessingTask else {
                task.setTaskCompleted(success: false)
                return
            }
            let work = Task {
                let success = (try? await SyncService().synchronize()) != nil
                task.setTaskCompleted(success: success)
            }
            task.expirationHandler = { work.cancel() }
        }
    }

    static func schedule() {
        let request = BGProcessingTaskRequest(identifier: taskIdentifier)
        request.requiresNetworkConnectivity = true
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
        try? BGTaskScheduler.shared.submit(request)
    }
}

final class SyncService {
    private let keychain = KeychainStore()
    private let healthKit = HealthKitReader()
    private let api = MobileAPIClient()

    func synchronize() async throws -> Int {
        guard let token = keychain.token() else { throw SyncError.missingDeviceToken }
        let payloads = await healthKit.dailyPayloads()
        for payload in payloads {
            try Task.checkCancellation()
            try await api.upload(payload, token: token)
        }
        SyncScheduler.schedule()
        return payloads.count
    }
}

@MainActor
final class SyncViewModel: ObservableObject {
    @Published private(set) var isPaired = false
    @Published private(set) var isWorking = false
    @Published private(set) var healthStatus = "未確認"
    @Published private(set) var lastSyncedAt: String?
    @Published private(set) var lastError: String?

    private let keychain = KeychainStore()
    private let healthKit = HealthKitReader()
    private let api = MobileAPIClient()

    func prepare() async {
        isPaired = keychain.token() != nil
        healthStatus = healthKit.isAvailable ? "利用可能" : "この iPhone では利用できません"
        healthKit.startObserving()
        if isPaired { await synchronize() }
    }

    func requestHealthAuthorization() async {
        await perform {
            try await self.healthKit.requestAuthorization()
            self.healthKit.startObserving()
            self.healthStatus = "アクセスを要求済み"
        }
    }

    func pair(with code: String) async {
        await perform {
            let name = UIDevice.current.name
            let token = try await self.api.pair(code: code, deviceName: name)
            try self.keychain.save(token: token)
            self.isPaired = true
            let count = try await SyncService().synchronize()
            self.lastSyncedAt = "\(Self.timestampFormatter.string(from: Date()))（\(count) 日分）"
        }
    }

    func synchronize() async {
        await perform {
            let count = try await SyncService().synchronize()
            self.lastSyncedAt = "\(Self.timestampFormatter.string(from: Date()))（\(count) 日分）"
        }
    }

    private func perform(_ operation: @escaping () async throws -> Void) async {
        guard !isWorking else { return }
        isWorking = true
        lastError = nil
        defer { isWorking = false }
        do {
            try await operation()
        } catch {
            lastError = error.localizedDescription
        }
    }

    private static let timestampFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()
}
