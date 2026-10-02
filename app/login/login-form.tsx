"use client";

import { useEffect, useRef, useState } from "react";

const LINES = [
  "Uma pedra por semana.",
  "O que você constrói hoje, outra geração herda.",
  "Constância vence pressa.",
  "Fundação primeiro. O resto vem.",
];

const NAME = "Primeira Geração";
const INTRO_MS = 1600;

type Phase = "intro" | "hold" | "leave" | "done";

function Mark() {
  const stones = [
    { d: "0.02s", x: 3, y: 36, w: 12, h: 12 },
    { d: "0.14s", x: 3, y: 9, w: 12, h: 27 },
    { d: "0.26s", x: 15, y: 27, w: 30, h: 9 },
    { d: "0.38s", x: 33, y: 9, w: 12, h: 18 },
    { d: "0.5s", x: 3, y: 0, w: 42, h: 9 },
  ];
  return (
    <svg className="mark-stones" viewBox="0 0 48 48" aria-hidden="true">
      {stones.map((stone) => (
        <rect key={stone.d} className="fall" style={{ animationDelay: stone.d }} x={stone.x} y={stone.y} width={stone.w} height={stone.h} />
      ))}
    </svg>
  );
}

export function LoginForm({ erro }: { erro: boolean }) {
  const [phase, setPhase] = useState<Phase>(erro ? "done" : "intro");
  const [skipped, setSkipped] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState(LINES[0]);
  const splashRef = useRef<HTMLButtonElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLine(LINES[Math.floor(Math.random() * LINES.length)]);
  }, []);

  useEffect(() => {
    if (erro) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("hold");
      setSkipped(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setPhase((current) => (current === "intro" ? "hold" : current));
    }, INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [erro]);

  useEffect(() => {
    if (phase === "leave") {
      const timer = window.setTimeout(() => setPhase("done"), 500);
      return () => window.clearTimeout(timer);
    }
    if (phase === "done") {
      passwordRef.current?.focus();
      return;
    }
    splashRef.current?.focus();
  }, [phase]);

  function advance() {
    if (phase === "intro") {
      setSkipped(true);
      setPhase("hold");
      return;
    }
    if (phase === "hold") setPhase("leave");
  }

  const waiting = phase === "intro" || phase === "hold" || phase === "leave";
  const splashClass = [
    "splash",
    phase === "leave" ? "is-hold is-leave" : `is-${phase}`,
    skipped ? "is-skip" : "",
  ].filter(Boolean).join(" ");

  return (
    <main className="login">
      {waiting ? (
        <button
          ref={splashRef}
          type="button"
          className={splashClass}
          aria-label="Entrar no Primeira Geração"
          onClick={advance}
        >
          <div className="splash-in">
            <Mark />
            <p className="splash-word" aria-hidden="true">
              {NAME.split("").map((ch, i) =>
                ch === " " ? (
                  <span key={i} className="sp"> </span>
                ) : (
                  <span key={i} style={{ animationDelay: `${0.82 + i * 0.028}s` }}>{ch}</span>
                )
              )}
            </p>
            <p className="splash-line">{line}</p>
          </div>
          <p className="splash-hint">
            <span className="hint-touch">Toque para entrar</span>
            <span className="hint-mouse">Clique ou pressione Enter para entrar</span>
          </p>
        </button>
      ) : null}
      <form
        method="POST"
        action="/api/login"
        className="login-card"
        aria-hidden={phase !== "done"}
        inert={phase !== "done"}
        onSubmit={(event) => {
          if (!event.currentTarget.checkValidity()) return;
          setBusy(true);
        }}
      >
        <div className="login-mark" aria-hidden="true"><Mark /></div>
        <h1>Primeira Geração</h1>
        <p className="sub">O sábado, a carteira e o próximo passo.</p>
        <label className="field" style={{ marginTop: 24 }}>
          <span>Senha</span>
          <span className="pass">
            <input
              ref={passwordRef}
              type={show ? "text" : "password"}
              name="senha"
              autoComplete="current-password"
              required
              aria-invalid={erro || undefined}
            />
            <button className="ghost" type="button" aria-pressed={show} onClick={() => setShow((value) => !value)}>
              {show ? "Ocultar" : "Mostrar"}
            </button>
          </span>
        </label>
        {erro ? <p className="alert red shake">Senha incorreta. Tente de novo.</p> : null}
        <div className="actions">
          <button className="main" type="submit" aria-busy={busy || undefined} disabled={busy}>
            {busy ? "Entrando" : "Entrar"}
          </button>
        </div>
      </form>
    </main>
  );
}
