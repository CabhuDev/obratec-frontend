// Skeleton Loading Component
// Inspired by modern loading states like in menu.jpg

function SkeletonLoader({ type = 'card', count = 1 }) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="modern-card">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" style={{ width: '100%' }} />
            <div className="skeleton skeleton-text" style={{ width: '80%' }} />
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          </div>
        );

      case 'table-row':
        return (
          <tr>
            <td><div className="skeleton skeleton-text" /></td>
            <td><div className="skeleton skeleton-text" /></td>
            <td><div className="skeleton skeleton-text" /></td>
            <td><div className="skeleton skeleton-button" /></td>
          </tr>
        );

      case 'stat':
        return (
          <div className="stat-card">
            <div className="skeleton skeleton-avatar" style={{ marginRight: '1rem' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" style={{ width: '60px', height: '32px', marginBottom: '0.5rem' }} />
              <div className="skeleton skeleton-text" style={{ width: '100px', height: '14px' }} />
            </div>
          </div>
        );

      case 'list-item':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'white', borderRadius: '8px', marginBottom: '0.5rem' }}>
            <div className="skeleton skeleton-avatar" />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '0.5rem' }} />
              <div className="skeleton skeleton-text" style={{ width: '40%' }} />
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="fade-in">
            {/* Header */}
            <div className="dashboard-header">
              <div>
                <div className="skeleton skeleton-title" style={{ width: '200px', marginBottom: '0.5rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '300px' }} />
              </div>
              <div className="skeleton skeleton-button" />
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="stat-card">
                  <div className="skeleton skeleton-avatar" style={{ width: '60px', height: '60px' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" style={{ width: '60px', height: '32px', marginBottom: '0.5rem' }} />
                    <div className="skeleton skeleton-text" style={{ width: '100px', height: '14px' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Reports Card */}
            <div className="card">
              <div className="card-header">
                <div className="skeleton skeleton-title" style={{ width: '150px' }} />
                <div className="skeleton skeleton-button" />
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th><div className="skeleton skeleton-text" style={{ width: '80px' }} /></th>
                      <th><div className="skeleton skeleton-text" style={{ width: '80px' }} /></th>
                      <th><div className="skeleton skeleton-text" style={{ width: '80px' }} /></th>
                      <th><div className="skeleton skeleton-text" style={{ width: '80px' }} /></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        <td><div className="skeleton skeleton-text" /></td>
                        <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                        <td><div className="skeleton skeleton-text" style={{ width: '50px' }} /></td>
                        <td><div className="skeleton skeleton-text" style={{ width: '80px' }} /></td>
                        <td><div className="skeleton skeleton-button" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="skeleton skeleton-card" />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
}

export default SkeletonLoader;
