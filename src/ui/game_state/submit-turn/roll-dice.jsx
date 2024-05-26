import { prettyifyName } from "../../../utils.js";
import { LabelElement } from "./base.jsx";
import { Select } from "./select.jsx";

export function RollDice({ spec, value, setValue, allowManualRolls }) {
    if(value === undefined) {
        setValue({ type: "die-roll", manual: false });
        return;
    }

    const selectManualRoll = () => {
        setValue({
            type: "die-roll",
            manual: true,
            dice: spec.expandedDice.map(() => undefined),
        });
    };

    // The number of dice has changed
    if(value.manual && spec.expandedDice.length !== value.dice.length) {
        selectManualRoll();
        return;
    }

    const selectRollType = rollType => {
        if(rollType == "Manual Roll") {
            selectManualRoll();
        }
        else {
            setValue({ type: "die-roll", manual: false });
        }
    };

    let diceSection;
    if(value.manual) {
        let dieNumber;
        let dieName;

        diceSection = (
            <div className="submit-turn-field-wrapper">
                {spec.expandedDice.map((die, index) => {
                    const setDieValue = newRoll => {
                        setValue({
                            ...value,
                            dice: [...value.dice.slice(0, index), newRoll, ...value.dice.slice(index + 1)]
                        });
                    };

                    // Count the number of die of each type
                    if(dieName != die.name) {
                        dieName = die.name;
                        dieNumber = 0;
                    }

                    ++dieNumber;

                    return (
                        <LabelElement key={index} name={`${prettyifyName(die.name)} ${dieNumber}`} small>
                            <Select
                                spec={{ options: die.sideNames }}
                                value={value.dice[index]}
                                setValue={setDieValue}></Select>
                        </LabelElement>
                    );
                })}
            </div>
        );
    }

    return (
        <>
            {allowManualRolls ?
                <Select
                    spec={{ options: ["Auto Roll", "Manual Roll"] }}
                    value={value.manual ? "Manual Roll" : "Auto Roll"}
                    setValue={selectRollType}></Select> : undefined}
            <p>
                {value.manual ? "Roll the following dice" : "The following dice will be rolled on submit"}
                <ul>
                    {spec.describeDice().map(description => {
                        return (
                            <li key={description}>{description}</li>
                        );
                    })}
                </ul>
            </p>
            {diceSection}
        </>
    );
}