
function UpgradeGrid({ upgrades, xpPoints, onNodeClick }) {
    const CELL = 65;
    const CENTER = 375;

    function groupByDepth(nodes) {
        const groups = {};

        nodes.forEach((node) => {
            const depth = Number(node.x);
            if (!groups[depth]) groups[depth] = [];
            groups[depth].push(node);
        });

        Object.values(groups).forEach((arr) =>
            arr.sort((a, b) => Number(a.y) - Number(b.y))
        );

        return groups;
    }

    function getNodePosition(node, type, depthGroups) {
        const depth = Number(node.x); 
        const nodesAtDepth = depthGroups[depth];
        const count = nodesAtDepth.length;

        const index = nodesAtDepth.findIndex((n) => n.id === node.id);
        const along = depth * CELL;
        const sideways = (index - (count - 1) / 2) * CELL;

        let dx = 0;
        let dy = 0;

        switch (type) {
            case "luck": // top branch
                dx = sideways;
                dy = -along;
                break;
            case "skill": // left branch
                dx = -along;
                dy = sideways;
                break;
            case "focus": // right branch
                dx = along;
                dy = sideways;
                break;
            default:
                dx = 0;
                dy = 0;
        }

        return {
            left: CENTER + dx,
            top: CENTER + dy,
        };
    }

    const renderNodes = (type) => {
        const nodes = upgrades[type];
        const depthGroups = groupByDepth(nodes);

        return nodes.map((node) => {
            const { left, top } = getNodePosition(node, type, depthGroups);

            let icon = "X";
            if(node.type === 'perk') {
                icon = node.perk.icon;
            }
            if(node.type === 'modifier') {
                icon = node.modifier.icon;
            }

            let borderStyle = "";
            if(type === "luck") {
                borderStyle = "border-teal-400/40 shadow-[0_0_20px_rgba(74,222,128,0.6)]";
            }
            if(type === "skill") {
                borderStyle = "border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.8)]";
            }
            if(type === "focus") {
                borderStyle = "border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.8)]";
            }
            if(node.type === "perk") {
                borderStyle = "border-yellow-300/40 shadow-[0_0_15px_rgba(253,224,71,0.8)]";
            }

            let backgroundStyle = "";
            if(node.unlocked) {
                if(type === "luck") {
                    backgroundStyle = "bg-teal-400";
                }
                if(type === "skill") {
                    backgroundStyle = "bg-red-500";
                }
                if(type === "focus") {
                    backgroundStyle = "bg-blue-500";
                }
                if(node.type === "perk") {
                    backgroundStyle = "bg-yellow-300";
                }
            }

            let obj = null;
            if(node.type === "perk") {
                obj = {
                    type: node.type,
                    unlocked: node.unlocked,
                    node: node.perk
                };
            }
            if(node.type === "modifier") {
                obj = {
                    type: node.type,
                    unlocked: node.unlocked,
                    node: node.modifier
                };
            }

            return (
                <div
                    key={type + node.id}
                    className={`
                        absolute rounded-full  
                        w-15 h-15 
                        flex items-center justify-center 
                        text-white font-bold text-[1.75rem]
                        transition-all duration-300
                        border-0
                        hover:scale-105
                        active:scale-95
                        ${borderStyle}
                        ${backgroundStyle}
                `}
                    style={{
                        left: `${left}px`,
                        top: `${top}px`,
                        transform: "translate(-50%, -50%)",
                    }}
                    onClick={() => onNodeClick(obj)}
                >
                    {icon && (
                        <img
                            src = {`icons/${icon}`}
                            alt = ""
                            className="w-12 h-12 pointer-events-none select-none"
                        />
                    )}
                </div>
            );
        });
    };

    return (
        <div className="w-[750px] h-[750px] relative overflow-hidden z-10">
            <div className="
                absolute 
                left-1/2 top-1/2 
                w-15 h-15 
                bg-gray-300 rounded-full 
                flex items-center justify-center 
                font-bold text-[2.25rem] text-black 
                transform -translate-x-1/2 -translate-y-1/2
                border-gray-300/30
                shadow-[0_0_25px_rgba(209,213,219,0.6)]
                select-none
            ">
                {xpPoints}
            </div>

            {renderNodes("luck")}
            {renderNodes("skill")}
            {renderNodes("focus")}
        </div>
    );
}

export default UpgradeGrid;