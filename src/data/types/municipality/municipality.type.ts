import { MunicipalityStatus } from "../../municipality.model";

export interface GetMunicipalitiesFilters {
    status?: MunicipalityStatus;
    districtId?: string;
}

export interface MunicipalityResponse {
    id: string;
    name: string;
    district: {
        id: string;
        name: string;
    };
    status: MunicipalityStatus;
    createdAt: Date;
    updatedAt: Date;
}
