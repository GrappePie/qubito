"use client";

import CreateItem from "@/components/item/createItem";


const CreateItemPage = () => {

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Create New Item</h1>
            <CreateItem />
        </div>
    );
};

export default CreateItemPage;