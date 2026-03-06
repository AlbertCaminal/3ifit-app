import { getFeedPosts, getClapXPStatus } from "./actions";
import ComunidadClient from "./ComunidadClient";

export const revalidate = 60;

export default async function ComunidadPage() {
  const [posts, clapStatus] = await Promise.all([
    getFeedPosts(),
    getClapXPStatus(),
  ]);

  return <ComunidadClient posts={posts} clapXPStatus={clapStatus} />;
}
