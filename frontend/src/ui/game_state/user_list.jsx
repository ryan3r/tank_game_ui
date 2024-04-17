import "./user_list.css";

// Display friendly names for the user types
export const userTypeToHeaders = {
    council: "Councilors",
    senate: "Senators",
};


function capitalize(text) {
    if(text.length == 0) return "";

    return text[0].toUpperCase() + text.slice(1);
}


export function UserList({ gameState }) {
    if(!gameState) {
        return "Loading...";
    }

    return (
        <div className="user-list">
            {gameState.players.getAllPlayerTypes().map(playerType => {
                return (
                    <Section name={playerType} users={gameState.players.getPlayersByType(playerType)}></Section>
                );
            })}
        </div>
    )
}


function Section({ name, users }) {
    // Each section is guarenteed to have at least 1 user
    const header = users[0].entities.length > 0 ? Object.keys(users[0].getControlledResources()) : [];
    const tableHeader = ["name"].concat(header);

    let content;

    // No extra fields just make a list
    if(tableHeader.length == 1 && tableHeader[0] == "name") {
        content = (
            <ul>
                {users.map(user => <li>{user.name}</li>)}
            </ul>
        );
    }
    else {
        content = (
            <table className="user-list-table">
                <tr>
                    {tableHeader.map(name => <th>{capitalize(name)}</th>)}
                </tr>
                {users.map(user => (
                    <UserInfo user={user} tableHeader={tableHeader}></UserInfo>
                ))}
            </table>
        );
    }

    const displayName = userTypeToHeaders[name] || (capitalize(name) + "s");

    return (
        <>
            <h3>{displayName}</h3>
            {content}
        </>
    );
}


function UserInfo({ user, tableHeader }) {
    const resources = user.getControlledResources();

    return (
        <tr>
            {tableHeader.map(key => {
                const alignment = key == "name" ? "start" : "end";

                return (
                    <td style={`text-align: ${alignment};`}>{resources[key] ? resources[key].value : user[key]}</td>
                );
            })}
        </tr>
    );
}