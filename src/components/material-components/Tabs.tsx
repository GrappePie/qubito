import { ReactNode, useEffect, useRef, useState} from "react";

type Tab = {
    title: string;
    content: ReactNode;
};

type TabsProps = {
    tabs: Tab[];
    initialIndex?: number;
};
export const Tab = ({value}: { value: string }) => {
    return (
        <li role={"tab"}
            className="flex items-center justify-center text-center w-full h-full relative bg-transparent py-1 px-2 text-blue-gray-900 antialiased font-sans text-base font-normal leading-relaxed select-none cursor-pointer">
            <div className="z-20 text-inherit">{value}</div>
            <div className="absolute inset-0 z-10 h-full bg-white rounded-md shadow"></div>
        </li>
    );
}

export const Tabs = ({tabs, initialIndex = 0}: TabsProps) => {
    const tabRef = useRef<HTMLDivElement>(null);
    const [tabWidth, setTabWidth] = useState<number>(0);
    const [currentTab, setCurrentTab] = useState(initialIndex);
    const [animate, setAnimate] = useState(false);

    const updateTabWidth = () => {
        if (tabRef.current) {
            const parentWidth = tabRef.current.getBoundingClientRect().width;
            const numberOfTabs = tabs.length;
            const newTabWidth = parentWidth / numberOfTabs;
            setTabWidth(newTabWidth);
        }
    }
    useEffect(() => {
        setCurrentTab(initialIndex);
    }, [initialIndex]);
    useEffect(() => {
        setAnimate(true);
        const timeout = setTimeout(() => setAnimate(false), 500); // duración de la animación
        return () => clearTimeout(timeout);
    }, [currentTab]);

    useEffect(() => {
        updateTabWidth();
    }, [tabs.length]);
    return (
        <div className={"w-full p-2"}>
            <div
                className="w-full flex items-center p-1 justify-between relative rounded-lg bg-[rgb(236,239,241)] bg-opacity-60 overflow-hidden"
                ref={tabRef}>
                {tabs.map((tab, idx) => (
                    <button
                        key={tab.title}
                        style={{
                            width: `${tabWidth}px`,
                        }}
                        className={"relative z-20 py-auto text-blue-gray-900 cursor-pointer h-9 text-sm "}
                        onClick={() => setCurrentTab(idx)}
                        type="button"
                    >
                        {tab.title}
                    </button>
                ))}
                <div className="absolute inset-0 h-8 my-auto bg-white rounded-md shadow transition-all duration-300"
                     style={{
                         width: `${tabWidth-8}px`,
                         left: `${currentTab * tabWidth +4 }px`,
                     }}></div>
            </div>
            <div className={`p-4 ${animate ? 'fadeEffect' : ''}`}>{tabs[currentTab]?.content}</div>
        </div>
    );
};