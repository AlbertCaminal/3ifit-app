import { getUserMissions, getDailyXPTasks } from "./actions";
import MisionesClient from "./MisionesClient";

export const dynamic = "force-dynamic";

export default async function MisionesPage() {
  const [{ missions, level, xpEarned }, dailyTasks] = await Promise.all([
    getUserMissions(),
    getDailyXPTasks(),
  ]);

  return (
    <MisionesClient
      missions={missions}
      level={level}
      xpEarned={xpEarned}
      dailyTasks={dailyTasks}
    />
  );
}
