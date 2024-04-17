import { useCallback, useEffect, useMemo, useRef } from "preact/hooks";
import "./log_book.css";

export function LogBook({ logBook, changeEntryId, currentEntryId }) {
    if(!logBook) {
        return <p>Loading...</p>;
    }

    const actionsByDay = useMemo(() => {
        let actionsByDay = {};

        for(const logEntry of logBook) {
            if(!actionsByDay[logEntry.day]) {
                actionsByDay[logEntry.day] = [];
            }

            actionsByDay[logEntry.day].push(logEntry);
        }

        return actionsByDay;
    }, [logBook]);

    return (
        <div className="log-book">
            {Object.keys(actionsByDay).map(day => {
                return (
                    <DaySection day={day} logEntries={actionsByDay[day]} changeEntryId={changeEntryId} currentEntryId={currentEntryId}></DaySection>
                );
            })}
        </div>
    );
}

function DaySection({ day, logEntries, currentEntryId, changeEntryId }) {
    const selectEntry = useCallback((e, logEntry) => {
        e.preventDefault();
        changeEntryId(logEntry.id);
    }, [changeEntryId]);

    return (
        <>
            <h3 class="log-book-day-heading">Day {day}</h3>
            {logEntries.map(logEntry => {
                const isCurrent = currentEntryId == logEntry.id;
                const scrollRef = useRef();

                useEffect(() => {
                    if(isCurrent) {
                        scrollRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
                    }
                }, [scrollRef, isCurrent])

                let entryClasses = "log-entry";

                if(isCurrent) {
                    entryClasses += " log-entry-current-turn";
                }

                return (
                    <div className={entryClasses} ref={scrollRef}>
                        <a className="log-book-link" href="#" onClick={e => selectEntry(e, logEntry)}>
                            {logEntry.message}
                        </a>
                    </div>
                );
            })}
        </>
    );
}