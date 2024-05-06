export function AppContent({ debugMode, withSidebar, toolbar, children }) {
    return (
        <div className={`app-wrapper ${withSidebar ? "with-sidebar" : ""}`}>
            {debugMode}
            {toolbar}
            <div className="app-content">
                <div className="app-content-footer-sibling">{children}</div>
                <footer>
                    <i>{APP_VERSION}</i>
                </footer>
            </div>
        </div>
    );
}