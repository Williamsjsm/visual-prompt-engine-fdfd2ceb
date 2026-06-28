import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar, type SectionKey } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { SectionHeader } from "@/components/views/SectionHeader";
import { DashboardView } from "@/components/views/DashboardView";
import { GenerarPromptView } from "@/components/views/GenerarPromptView";
import { GenerarImagenView } from "@/components/views/GenerarImagenView";
import { HistorialView } from "@/components/views/HistorialView";
import { FavoritosView } from "@/components/views/FavoritosView";
import { AvataresView } from "@/components/views/AvataresView";
import { ConfiguracionView } from "@/components/views/ConfiguracionView";
import { AyudaView } from "@/components/views/AyudaView";
import { PromptProvider } from "@/lib/prompt-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prompt Generator — Genera prompts perfectos con IA" },
      {
        name: "description",
        content:
          "Sube imágenes o videos y obtén el prompt perfecto al instante. Análisis profundo, exportación y compatibilidad con Midjourney, Flux, Veo, Kling y más.",
      },
    ],
  }),
  component: DashboardPage,
});

const headers: Record<SectionKey, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Resumen general de tu actividad creativa.",
  },
  "generar-prompt": {
    title: "Generar Prompt",
    subtitle: "Sube una imagen o video y obtén el prompt perfecto.",
  },
  "generar-imagen": {
    title: "Generar Imagen",
    subtitle: "Crea imágenes desde texto con los mejores modelos.",
  },
  historial: {
    title: "Historial",
    subtitle: "Todos tus prompts, imágenes y videos generados.",
  },
  favoritos: {
    title: "Favoritos",
    subtitle: "Tus prompts guardados para reutilizar.",
  },
  avatares: {
    title: "Avatares",
    subtitle: "Guarda identidades y referencias para mantener continuidad entre videos.",
  },
  configuracion: {
    title: "Configuración",
    subtitle: "Personaliza modelos, idioma y preferencias.",
  },
  ayuda: {
    title: "Ayuda",
    subtitle: "Guías rápidas y respuestas a tus dudas.",
  },
};

function DashboardPage() {
  const [active, setActive] = useState<SectionKey>("dashboard");

  return (
    <PromptProvider>
      <div className="app-shell min-h-screen w-full flex text-white">
        <Sidebar active={active} onChange={setActive} />
        <main className="app-main flex-1 min-w-0 px-4 lg:px-6 pb-10 pt-2">
          {active !== "dashboard" && <TopHeader />}
          {active !== "dashboard" && active !== "generar-prompt" && (
            <SectionHeader title={headers[active].title} subtitle={headers[active].subtitle} />
          )}
          {active === "dashboard" && <DashboardView onNavigate={setActive} />}
          {active === "generar-prompt" && <GenerarPromptView />}
          {active === "generar-imagen" && <GenerarImagenView />}
          {active === "historial" && <HistorialView />}
          {active === "favoritos" && <FavoritosView />}
          {active === "avatares" && <AvataresView />}
          {active === "configuracion" && <ConfiguracionView />}
          {active === "ayuda" && <AyudaView />}
        </main>
      </div>
    </PromptProvider>
  );
}
