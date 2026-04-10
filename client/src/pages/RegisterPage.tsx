import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(fullName, email, password);
      navigate('/');
    } catch {
      toast.error('Kayıt başarısız. Bu e-posta zaten kullanılıyor olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: 'var(--theme-color)' }}>Ajandam</h1>
          <p className="text-gray-500 mt-2">Günlerinizi planlayın, hayatınızı düzenleyin</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <h2 className="text-xl font-semibold text-gray-800">Kayıt Ol</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Ad Soyad</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent transition-all"
              placeholder="Ad Soyad" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">E-posta</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent transition-all"
              placeholder="ornek@email.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Şifre</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent transition-all"
              placeholder="En az 6 karakter" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-color)' }}>
            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--theme-color)' }}>
              Giriş Yap
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
