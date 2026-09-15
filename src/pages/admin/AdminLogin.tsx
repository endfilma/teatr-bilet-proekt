import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LOGO } from '@/data/theatre';

type Props = {
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

const AdminLogin = ({ password, setPassword, loading, onSubmit }: Props) => (
  <div className="flex min-h-screen items-center justify-center bg-page p-4">
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm space-y-4 rounded-3xl bg-background p-8"
    >
      <img src={LOGO} alt="Гелиос" className="h-12" />
      <h1 className="font-head text-2xl font-extrabold tracking-tightest">
        Управление театром
      </h1>
      <div className="space-y-2">
        <Label htmlFor="pwd">Пароль администратора</Label>
        <Input
          id="pwd"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-full font-bold"
      >
        Войти
      </Button>
    </form>
  </div>
);

export default AdminLogin;
