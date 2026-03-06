import dynamic from "next/dynamic";
import { getDailyXPStatus } from "./actions";
import RegistrarActividadLoading from "./loading";

const RegistrarActividadClient = dynamic(
  () => import("./RegistrarActividadClient").then((m) => m.default),
  { loading: () => <RegistrarActividadLoading /> }
);

export default async function RegistrarActividadPage() {
  const initialXpStatus = await getDailyXPStatus();
  return <RegistrarActividadClient initialXpStatus={initialXpStatus} />;
}
