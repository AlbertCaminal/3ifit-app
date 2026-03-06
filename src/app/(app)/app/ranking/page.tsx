import { getActiveSeason, getDepartmentRanking, getLeaderboardWithContext } from "./actions";
import RankingClient from "./RankingClient";

function getDaysRemainingInMonth(): number {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(0, Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default async function RankingPage() {
  const season = await getActiveSeason();
  const daysRemainingInMonth = getDaysRemainingInMonth();
  const [leaderboardResult, departmentRanking] = season
    ? await Promise.all([
        getLeaderboardWithContext(season.id),
        getDepartmentRanking(season.id),
      ])
    : [
        { top3: [], peloton: [], totalMinutesForGoal: 0, commonGoalMinutes: 20_000 },
        [],
      ];

  const { top3, peloton, totalMinutesForGoal, commonGoalMinutes } = leaderboardResult;

  return (
    <RankingClient
      season={season}
      top3={top3}
      peloton={peloton}
      totalMinutesForGoal={totalMinutesForGoal}
      commonGoalMinutes={commonGoalMinutes}
      departmentRanking={departmentRanking}
      daysRemainingInMonth={daysRemainingInMonth}
    />
  );
}
