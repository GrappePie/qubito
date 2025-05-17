import React, {useState,useEffect} from 'react';

const defaultCallback = () => {};
const addOrRemove = <T>(array: T[], value: T, compareFunction: (item1: T, item2: T) => boolean = () => false): T[] => {
    const newArray = [...array];
    const index = newArray.findIndex((e) => compareFunction ? compareFunction(e, value) : e === value);
    if (index === -1) {
        newArray.push(value);
    } else {
        newArray.splice(index, 1);
    }
    return newArray;
};
const isJSON = (str:string) => {
    try {
        JSON.parse(str);
    } catch {
        return false;
    }
    return true;
}

const parseEventValue = <T>(event: React.ChangeEvent<HTMLInputElement> | { name: keyof T; value: T[keyof T] }):{name:keyof T, value: T[keyof T]} => {
    const { name, value } = 'target' in event ? event.target : event;
    const parsedValue = typeof value === 'string' && isJSON(value) ? JSON.parse(value) : value;
    return { name: name as keyof T, value: parsedValue };    
}
export const useForm = <T>(initialValues: T, callback: (values: T) => void = defaultCallback) => {
    const [inputs, setInputs] = useState<T>(initialValues);

    const handleSubmit = (event: React.FormEvent) => {
        if (event) {
            event.preventDefault();
        }
        callback(inputs);
    };

   const handleInputChange = (event: React.ChangeEvent<HTMLInputElement> | { name: keyof T; value: T[keyof T] }) => {
       const { name, value } = parseEventValue<T>(event);
       const newValue = typeof value === 'string' && isJSON(value) ? JSON.parse(value) : value;
   
       setInputs((prev) => ({
           ...prev,
           [name]: newValue
       }));
   };

    const toggleElementList = (e: React.ChangeEvent<HTMLInputElement>  | { name: keyof T; value: T[keyof T] }, compareFunction?: (i1: T[keyof T], i2: T[keyof T]) => boolean) => {
        const { name, value } = parseEventValue<T>(e);
        const parsedValue = typeof value === 'string' && isJSON(value) ? JSON.parse(value) : value;

        setInputs((prev) => {
            const currentList = prev[name] as T[keyof T][];
            const newList = compareFunction
                ? addOrRemove(currentList, parsedValue, compareFunction)
                : currentList.includes(parsedValue)
                    ? currentList.filter((item) => item !== parsedValue)
                    : [...currentList, parsedValue];

            return {
                ...prev,
                [name]: newList
            };
        });
    };

    const removeElementList = (e: React.ChangeEvent<HTMLInputElement>  | { name: keyof T; value: T[keyof T] }) => {
        const { name, value } = parseEventValue<T>(e);
        const parsedValue = typeof value === 'string' && isJSON(value) ? JSON.parse(value) : value;

        setInputs((prev) => ({
            ...prev,
            [name]: (prev[name] as T[keyof T][]).filter((item) => item !== parsedValue)
        }));
    };

    const removeElementListByIndex = (e: React.ChangeEvent<HTMLInputElement>  | { name: keyof T; value: T[keyof T] }, index: number) => {
        const { name } = parseEventValue<T>(e);

        setInputs((prev) => ({
            ...prev,
            [name]: (prev[name] as T[keyof T][]).filter((_, i) => i !== index)
        }));
    };

    const removeElementListById = (e: React.ChangeEvent<HTMLInputElement> | { name: keyof T; value: T[keyof T] }, customID: string = 'id') => {
        const { name, value } = parseEventValue<T>(e);
        const parsedValue = typeof value === 'string' && isJSON(value) ? JSON.parse(value) : value;

        setInputs((prev) => ({
            ...prev,
          [name]: (prev[name] as Record<string, unknown>[]).filter((item) => (item as Record<string, unknown>)[customID] !== parsedValue)
        }));
    };

    const addElementList = (e: React.ChangeEvent<HTMLInputElement> | { name: keyof T; value: T[keyof T] }) => {
        const { name, value } = parseEventValue<T>(e);
        const parsedValue = typeof value === 'string' && isJSON(value) ? JSON.parse(value) : value;

        setInputs((prev) => ({
            ...prev,
            [name]: [...(prev[name] as T[keyof T][]), parsedValue]
        }));
    };

    useEffect(() => {
        setInputs(initialValues);
    }, [initialValues]);

    return {
        setInputs,
        handleSubmit,
        handleInputChange,
        addElementList,
        removeElementList,
        removeElementListByIndex,
        removeElementListById,
        toggleElementList,
        ...inputs,
        inputs
    };
};