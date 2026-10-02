import type { Metadata } from "next";

export const metadata: Metadata = { title: "Guia visual — Portal Tiago" };

const swatches: { name: string; bg: string; fg: string }[] = [
  { name: "Paper", bg: "var(--surface)", fg: "var(--text)" },
  { name: "Raised", bg: "var(--surface-raised)", fg: "var(--text)" },
  { name: "Sunken", bg: "var(--surface-sunken)", fg: "var(--text)" },
  { name: "Marca", bg: "var(--brand)", fg: "var(--on-brand)" },
  { name: "Reserva", bg: "var(--reserve)", fg: "var(--on-brand)" },
  { name: "Lance", bg: "var(--lance)", fg: "var(--on-brand)" },
  { name: "ARCA", bg: "var(--arca)", fg: "var(--on-brand)" },
  { name: "Sonhos", bg: "var(--dream)", fg: "var(--on-brand)" },
];

function Stage({ theme, title }: { theme: "light" | "dark"; title: string }) {
  return (
    <section className="stage" data-theme={theme}>
      <h2>{title}</h2>
      <div className="swatches">
        {swatches.map((item) => (
          <div key={item.name} className="swatch" style={{ background: item.bg, color: item.fg }}>
            {item.name}
            <small>{item.bg}</small>
          </div>
        ))}
      </div>
      <p className="sub">Rótulo em caption. O número é o herói.</p>
      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="stat hl">
          <span>Patrimônio</span>
          <b className="num">R$ 79,92</b>
          <small>fase 1</small>
        </div>
        <div className="stat">
          <span>Reserva</span>
          <b className="num">R$ 76,92</b>
          <div className="bar" style={{ ["--c" as string]: "var(--reserve)" }}>
            <i style={{ width: "18%" }} />
          </div>
          <small className="num">de R$ 400,00</small>
        </div>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="list">
          <div className="li">
            <div className="tag" style={{ ["--c" as string]: "var(--lance)" }}>La</div>
            <div>
              <b>Caixinha Lance</b>
              <small>até a meta</small>
            </div>
            <div className="v num">R$ 1,00</div>
          </div>
        </div>
        <div className="actions">
          <button className="main" type="button">Executei a cascata</button>
          <button className="ghost" type="button">Check-in</button>
          <span className="pill seal">Feito</span>
        </div>
      </div>
      <div className="seg" style={{ marginTop: 12 }}>
        <button type="button" aria-pressed="true">Não</button>
        <button type="button" aria-pressed="false">Sim</button>
      </div>
      <p className="alert" style={{ marginTop: 12 }}>Aporte primeiro. Vender só depois de uns 6 meses.</p>
      <p className="alert red">Dois sábados sem check-in.</p>
      <p className="empty">Nenhum movimento ainda. O primeiro registro começa o gráfico.</p>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="marcos">
          <div><span className="mark" aria-hidden="true" />1º check-in</div>
          <div className="ok"><span className="mark" aria-hidden="true" />Lance completo</div>
        </div>
      </div>
      <div className="chips" style={{ marginTop: 12 }}>
        <button type="button">Analisar carteira</button>
        <button type="button" disabled>Pensando</button>
      </div>
      <label className="field" style={{ marginTop: 12 }}>
        <span>Senha</span>
        <input type="text" readOnly value="" placeholder="Campo" />
      </label>
    </section>
  );
}

export default function DesignGuide() {
  return (
    <main className="guide">
      <header className="guide-head">
        <h1>Guia visual</h1>
        <p className="sub">Os dois temas do portal, com os mesmos componentes. O sistema está descrito em DESIGN.md.</p>
      </header>
      <div className="stages">
        <Stage theme="light" title="Claro" />
        <Stage theme="dark" title="Escuro" />
      </div>
    </main>
  );
}
