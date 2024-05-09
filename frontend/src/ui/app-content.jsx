export function AppContent({ debugMode, withSidebar, toolbar, buildInfo, children }) {
    return (
        <div className={`app-wrapper ${withSidebar ? "with-sidebar" : ""}`}>
            {debugMode}
            {buildInfo !== undefined ? <AutoRestart buildInfo={buildInfo}></AutoRestart> : undefined}
            {toolbar}
            <div className="app-content">
                {children}
                <footer>
                    <i>{APP_VERSION}</i>
                </footer>
            </div>
        </div>
    );
}

function AutoRestart({ buildInfo }) {
    const isOutDated = buildInfo !== BUILD_INFO;

    const reload = e => {
        e.preventDefault();
        location.reload();
    };

    if(isOutDated) {
        return (
            <div className="debug-mode-banner">
                You're version of tank game is out of date <a href="#" onClick={reload}>reload</a> to update.
            </div>
        );
    }
}