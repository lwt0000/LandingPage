import { CinematicBackground } from "@/components/background/CinematicBackground";
import { LiquidGlass } from "@/components/fx/LiquidGlass";
import { InspectProvider } from "@/components/inspect/InspectProvider";
import { FallbackNav, QuestMap } from "@/components/nav/QuestMap";
import { Inventory } from "@/components/nav/Inventory";
import { Spawn } from "@/components/scenes/Spawn";
import { Profile } from "@/components/scenes/Profile";
import { QuestPath } from "@/components/scenes/QuestPath";
import { Archive } from "@/components/scenes/Archive";
import { Missions } from "@/components/scenes/Missions";
import { AbilityTree } from "@/components/scenes/AbilityTree";
import { Achievements } from "@/components/scenes/Achievements";
import { Origin } from "@/components/scenes/Origin";
import { Portal } from "@/components/scenes/Portal";

function SceneDivider() {
  return <div aria-hidden className="scene-divider mx-auto max-w-4xl" />;
}

export default function Home() {
  return (
    <InspectProvider>
      <a href="#spawn" className="skip-link">
        Skip to content
      </a>
      <CinematicBackground />
      <LiquidGlass />
      <FallbackNav />
      <QuestMap />
      <Inventory />
      <main className="relative z-10">
        <Spawn />
        <Profile />
        <SceneDivider />
        <QuestPath />
        <SceneDivider />
        <Archive />
        <SceneDivider />
        <Missions />
        <SceneDivider />
        <AbilityTree />
        <SceneDivider />
        <Achievements />
        <SceneDivider />
        <Origin />
        <Portal />
      </main>
    </InspectProvider>
  );
}
