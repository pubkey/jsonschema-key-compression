export type MangoQuery = {
    selector: any;
    skip?: number;
    limit?: number;
    fields?: string[];
    sort?: { [k: string]: 1 | -1 }[] | string[];
};
