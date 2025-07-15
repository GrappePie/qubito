"use client";
import {useForm} from "@/hooks/useForm";
import {Item} from "@/models/Item";
import { Input, Select, Radio, Switch, Space, InputNumber, Card} from "antd";
import ImageInput from "@/components/item/ImageInput";
const { TextArea } = Input;


const initialItem: Item = {
    id: "",
    name: "",
    description: "",
    price: 0,
    barCode: "",
    categories: [],
    cost: 0,
    stock: 0,
    supplier: "",
    imageUrl: "",
    isAvailableForSale: false,
    lowStock: 0,
    owner: "",
    sku: "",
    variants: []
};

const CreateItem = () => {
    const {name,categories,isAvailableForSale,price,cost,sku,barCode, handleInputChange} = useForm<Item>(initialItem);
    
    return (
        <div className="container grid grid-cols-1 gap-10 w-2/3 h-[90vh] overflow-y-scroll hide-scrollbar mx-auto">
            <Card title="Create New Item" className="z-0 shadow-lg bg-white">
                <div className="grid grid-cols-2 gap-15 gap-y-8 p-4">
                    <div className="col-span-2">
                        <ImageInput />
                    </div>
                    <Input type="text" name="name" onChange={handleInputChange} defaultValue={name} placeholder="Product Name" required/>
                    <Select
                        placeholder={"Product Categories"}
                        mode="multiple"
                        value={categories}
                        onChange={(value) => handleInputChange({ name: "categories", value })}
                        options={[
                            { value: 'Forniture', label: 'Forniture' },
                            { value: 'Chamyto Category', label: 'Chamyto Category' },
                            { value: 'Yiminghe', label: 'yiminghe' },
                            { value: 'disabled', label: 'Disabled', disabled: true },
                        ]}
                        className="w-full"
                    />
                    <TextArea rootClassName="col-span-2" rows={4} placeholder="Description" showCount maxLength={100} />
                    <div>
                        <span className="mr-4">Available for sale.</span>
                        <Switch defaultChecked value={isAvailableForSale} onChange={(value) => handleInputChange({name:"isAvailableForSale" ,value })} />
                    </div>
                    <div>
                        <span className="mr-4">Sold By</span><Radio.Group
                        value={1}
                        options={[
                            { value: 1, label: 'Weight / Volume' },
                            { value: 2, label: 'Each' },
                        ]}
                    /></div>
                    <Space className="col-span-2">
                        <span className="mr-4">Price</span>
                        <InputNumber<number>
                            name="price"
                            defaultValue={price}
                            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                            onChange={(value)=> handleInputChange({name:"cost",value:value ?? 0})}
                        />
                        <span className="mr-4">Price</span>
                        <InputNumber<number>
                            name="cost"
                            defaultValue={cost}
                            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                            onChange={(value)=> handleInputChange({name:"cost",value:value ?? 0})}
                        />
                    </Space>
                    <Input
                        type="text"
                        name="sku"
                        onChange={handleInputChange}
                        value={sku}
                        placeholder="SKU" />
                    <Input
                        type="text"
                        name="barCode"
                        onChange={handleInputChange}
                        value={barCode}
                        placeholder="Bar Code" />
                </div>
            </Card>
            <Card title="Inventory" className="shadow-lg bg-white mt-4">
                
            </Card>
            <Card title="Variants" className="shadow-lg bg-white mt-4">
                
            </Card>
            <Card title="Modifiers" className="shadow-lg bg-white mt-4">
            </Card>
        </div>
    );
};

export default CreateItem;