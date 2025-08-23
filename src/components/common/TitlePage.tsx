interface props  {
    title: string,
    subtitle?: string,
};

const TitlePage = ({title,subtitle}:props) => {
    return (
        <div className={"p-4"}>
            <h1 className={"text-3xl font-bold text-slate-800"}>
                {title}
            </h1>
            {subtitle ? <p className={"text-slate-500 mt-1"}>{subtitle}</p> : null}
        </div>
    );
};

export default TitlePage;