import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="screen">
          <div className="empty">
            <h3>Aplikasi gagal dimuat</h3>
            <p>{this.state.error.message || "Terjadi error runtime di browser."}</p>
            <button className="button primary" onClick={() => window.location.reload()}>Muat Ulang</button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
