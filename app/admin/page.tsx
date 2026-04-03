import AdminPanel from '@/components/admin/AdminPanel';
import { DENTISTS } from '@/lib/dentists';

export default function AdminPage() {
  return <AdminPanel dentists={DENTISTS} />;
}
