import { getActiveSeason, getDepartmentRanking } from "../ranking/actions";
import { getHomeDataRpc, getHomeProfile } from "./actions";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const seasonPromise = getActiveSeason();
  const profilePromise = getHomeDataRpc().catch(() => getHomeProfile());
  const [profile, season, departmentRanking] = await Promise.all([
    profilePromise,
    seasonPromise,
    seasonPromise.then((s) => (s ? getDepartmentRanking(s.id) : [])),
  ]);

  return (
    <HomeClient
      profile={profile}
      departmentRanking={departmentRanking}
      xpEarned={profile?.xpEarned}
      perfectStreakWeeks={profile?.perfectStreakWeeks}
    />
  );
}
