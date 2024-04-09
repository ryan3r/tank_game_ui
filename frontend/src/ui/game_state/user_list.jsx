import "./user_list.css";
import { orderedKeys, userTypeToHeaders, fieldAlignment, defaultAlignment } from "../../config.js";

function capitalize(text) {
    if(text.length == 0) return "";

    return text[0].toUpperCase() + text.slice(1);
}

export function UserList({ turnState }) {
    if(!turnState) {
        return "Loading...";
    }

    return (
        <div className="user-list">
            {turnState.getAllPlayerTypes().map(playerType => {
                return (
                    <Section name={playerType} users={turnState.getEntitiesByType(playerType)}></Section>
                );
            })}
        </div>
    )
}


function Section({ name, users }) {
    // Each section is guarenteed to have at least 1 user
    const tableHeader = ["name"].concat(Object.keys(users[0].resources));

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
    return (
        <tr>
            {tableHeader.map(key => {
                const alignment = fieldAlignment[key] || defaultAlignment;

                return (
                    <td style={`text-align: ${alignment};`}>{user.resources[key] ? user.resources[key].value : user[key]}</td>
                );
            })}
        </tr>
    );
}