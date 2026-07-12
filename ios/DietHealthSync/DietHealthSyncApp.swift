import BackgroundTasks
import SwiftUI

@main
struct DietHealthSyncApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var viewModel = SyncViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView(viewModel: viewModel)
                .task { await viewModel.prepare() }
        }
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        SyncScheduler.register()
        return true
    }
}

struct ContentView: View {
    @ObservedObject var viewModel: SyncViewModel
    @State private var pairingCode = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("接続状態") {
                    LabeledContent("HealthKit") {
                        Text(viewModel.healthStatus)
                    }
                    LabeledContent("最終同期") {
                        Text(viewModel.lastSyncedAt ?? "未同期")
                    }
                    if let error = viewModel.lastError {
                        Text(error)
                            .foregroundStyle(.red)
                            .font(.footnote)
                    }
                }

                if viewModel.isPaired {
                    Section("同期") {
                        Button("今すぐ同期") {
                            Task { await viewModel.synchronize() }
                        }
                        .disabled(viewModel.isWorking)

                        Text("初回は過去30日、以後も直近30日を再集計します。バックグラウンド同期は iOS の実行判断に依存します。")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                } else {
                    Section("初回設定") {
                        TextField("ペアリングコード", text: $pairingCode)
                            .textInputAutocapitalization(.characters)
                            .autocorrectionDisabled()

                        Button("この iPhone を接続") {
                            Task { await viewModel.pair(with: pairingCode) }
                        }
                        .disabled(pairingCode.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || viewModel.isWorking)

                        Text("PC で発行した一回限りのコードを入力します。共通 API キーはこのアプリに保存されません。")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("ヘルスケア") {
                    Button("ヘルスケアへのアクセスを許可") {
                        Task { await viewModel.requestHealthAuthorization() }
                    }
                    .disabled(viewModel.isWorking)

                    Text("体重、体脂肪率、除脂肪体重、歩数、アクティブエネルギー、安静時エネルギーを読み取ります。書き込みは行いません。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Diet Sync")
            .overlay {
                if viewModel.isWorking {
                    ProgressView()
                        .controlSize(.large)
                }
            }
        }
    }
}
