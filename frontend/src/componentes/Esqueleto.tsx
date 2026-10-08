interface PropsEsqueletoTexto {
  width?: string | number;
  height?: number;
}

export function EsqueletoTexto({ width = "100%", height = 12 }: PropsEsqueletoTexto) {
  return <div className="skeleton skeleton-text" style={{ width, height }} />;
}

export function EsqueletoTarjeta() {
  return (
    <div className="skeleton-card">
      <div className="row-between">
        <EsqueletoTexto width={70} height={20} />
        <EsqueletoTexto width={60} height={18} />
      </div>
      <EsqueletoTexto width="80%" height={16} />
      <EsqueletoTexto width="100%" />
      <EsqueletoTexto width="60%" />
      <div style={{ marginTop: 6 }}>
        <EsqueletoTexto width="100%" height={7} />
      </div>
      <EsqueletoTexto width="100%" height={34} />
    </div>
  );
}

export function EsqueletoCuadricula({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <div className="topic-grid">
      {Array.from({ length: cantidad }).map((_, i) => (
        <EsqueletoTarjeta key={i} />
      ))}
    </div>
  );
}

export function EsqueletoFilaEstadisticas({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <div className="stat-grid">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div className="skeleton-card" key={i} style={{ padding: "18px 20px" }}>
          <EsqueletoTexto width={34} height={34} />
          <EsqueletoTexto width="50%" height={22} />
          <EsqueletoTexto width="70%" />
        </div>
      ))}
    </div>
  );
}
