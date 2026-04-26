import { requireCurrentUser } from "@/lib/auth/current-user";
import { AIFutureSelfFlow } from "./ai-future-self-flow";

export default async function FutureSelfAIGeneratePage() {
  await requireCurrentUser();

  return <AIFutureSelfFlow />;
}
