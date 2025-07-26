'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function InputPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    bodyFatPercentage: '',
    muscleMass: '',
    steps: '',
    activeCalories: '',
    restingCalories: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          bodyFatPercentage: formData.bodyFatPercentage ? parseFloat(formData.bodyFatPercentage) : null,
          muscleMass: formData.muscleMass ? parseFloat(formData.muscleMass) : null,
          steps: formData.steps ? parseInt(formData.steps) : null,
          activeCalories: formData.activeCalories ? parseInt(formData.activeCalories) : null,
          restingCalories: formData.restingCalories ? parseInt(formData.restingCalories) : null,
        }),
      });

      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to save data:', error);
      alert('データの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            ダッシュボードに戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">健康データ入力</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                日付
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  体重 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="65.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="bodyFatPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                  体脂肪率 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="bodyFatPercentage"
                  name="bodyFatPercentage"
                  value={formData.bodyFatPercentage}
                  onChange={handleChange}
                  placeholder="20.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="muscleMass" className="block text-sm font-medium text-gray-700 mb-1">
                  筋肉量 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="muscleMass"
                  name="muscleMass"
                  value={formData.muscleMass}
                  onChange={handleChange}
                  placeholder="50.2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="steps" className="block text-sm font-medium text-gray-700 mb-1">
                  歩数
                </label>
                <input
                  type="number"
                  id="steps"
                  name="steps"
                  value={formData.steps}
                  onChange={handleChange}
                  placeholder="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="activeCalories" className="block text-sm font-medium text-gray-700 mb-1">
                  アクティブカロリー (kcal)
                </label>
                <input
                  type="number"
                  id="activeCalories"
                  name="activeCalories"
                  value={formData.activeCalories}
                  onChange={handleChange}
                  placeholder="300"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="restingCalories" className="block text-sm font-medium text-gray-700 mb-1">
                  安静時カロリー (kcal)
                </label>
                <input
                  type="number"
                  id="restingCalories"
                  name="restingCalories"
                  value={formData.restingCalories}
                  onChange={handleChange}
                  placeholder="1500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {saving ? (
                  '保存中...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}