import {ReactElement, ReactNode, useEffect, useRef, useState} from "react";

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
export const TabsHeader = ({children}: { children: ReactElement<typeof Tab> }) => {
    return (
        <nav>
            <ul role="tablist" className="flex relative bg-blue-gray-50 bg-opacity-60 rounded-lg p-1 flex-row">
                {children}
            </ul>
        </nav>
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
        const resizeObserver = new ResizeObserver(updateTabWidth);
        if (tabRef.current) {
            resizeObserver.observe(tabRef.current!);
        }
        return () => {
            if (tabRef.current) {
                resizeObserver.unobserve(tabRef.current);
            }
        }
    }, [tabs.length]);
    return (
        <div className={"w-1/2"}>
            <div
                className="w-full flex items-center  justify-between relative rounded-full bg-[rgb(236,239,241)] bg-opacity-60"
                ref={tabRef}>
                {tabs.map((tab, idx) => (
                    <button
                        key={tab.title}
                        style={{
                            width: `${tabWidth}px`,
                        }}
                        className={"relative z-20 py-3 text-[rgb(38,50,56)] cursor-pointer h-8 text-sm"}
                        onClick={() => setCurrentTab(idx)}
                        type="button"
                    >
                        {tab.title}
                    </button>
                ))}
                <div className="absolute inset-0 h-6 bg-white rounded-md shadow transition-all duration-300 top-1"
                     style={{
                         width: `${tabWidth}px`,
                         left: `${currentTab * tabWidth}px`,
                     }}></div>
            </div>
            <div className={`p-4 ${animate ? 'fadeEffect' : ''}`}>{tabs[currentTab]?.content}</div>
        </div>
    );
};