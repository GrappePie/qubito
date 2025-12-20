"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs } from "@/components/material-components/Tabs";
import CreateItem from "@/components/item/createItem";
import { useAccounts } from "@/contexts/AccountsContext";

const tabs = [
    {title: "Create Item", content: <CreateItem />},
    {title: "Tab 2", content: "Content 2"},
    {title: "Tab 3", content: "Content 3"},
];

const Test = () => {
    const router = useRouter();
    const { loading, hasPermission } = useAccounts();

    useEffect(() => {
        if (loading) return;
        if (!hasPermission('settings.manage')) {
            router.replace('/');
        }
    }, [loading, hasPermission, router]);

    if (loading || !hasPermission('settings.manage')) {
        return null;
    }

    return (
        <div>
            <Tabs tabs={tabs}/>
        </div>
    );
};

export default Test;
