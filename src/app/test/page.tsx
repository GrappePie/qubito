"use client";
import {Tabs} from "@/components/material-components/Tabs";
import CreateItem from "@/components/item/createItem";

const tabs = [
    {title: "Create Item", content: <CreateItem />},
    {title: "Tab 2", content: "Content 2"},
    {title: "Tab 3", content: "Content 3"},
];

const Test = () => {
    return (
        <div>
            <Tabs tabs={tabs}/>
        </div>
    );
};

export default Test;