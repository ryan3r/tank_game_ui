import { prettyifyName } from "../../../../common/state/utils.mjs";
import { AttributeList } from "./attribute-list.jsx";
import "./council.css";

// Display friendly names for the user types
export const userTypeToHeaders = {
    council: "Councilors",
    senate: "Senators",
};


export function Council({ gameState, config }) {
    if(!gameState || !config) {
        return "Loading...";
    }

    return (
        <>
            <AttributeList attributes={gameState.council}></AttributeList>
            <div className="user-list">
                {config.getCouncilPlayerTypes().map(playerType => {
                    return (
                        <Section name={playerType} users={gameState.players.getPlayersByType(playerType)}></Section>
                    );
                })}
            </div>
        </>
    )
}


function Section({ name, users }) {
    const displayName = userTypeToHeaders[name] || (prettyifyName(name) + "s");

    return (
        <>
            <h3>{displayName}</h3>
            <ul>
                {users.map(user => <li>{user.name}</li>)}
            </ul>
        </>
    );
}
