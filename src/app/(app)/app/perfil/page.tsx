import { getPerfilProfile } from "./actions";
import PerfilClient from "./PerfilClient";

export default async function PerfilPage() {
  const profile = await getPerfilProfile();

  return <PerfilClient profile={profile} />;
}
