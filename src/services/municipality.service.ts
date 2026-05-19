import { ObjectId } from "mongodb";
import { MunicipalityStatus } from "../data/municipality.model";
import { MunicipalityRepository } from "../repositorys/municipality.repository";

const VALID_STATUSES: MunicipalityStatus[] = ["active", "inactive"];

interface GetMunicipalitiesParams {
    status?: string;
    districtId?: string;
}

interface CreateMunicipalityParams {
    name: string;
    districtId: string;
    status?: MunicipalityStatus;
}

interface UpdateMunicipalityParams {
    name?: string;
    districtId?: string;
    status?: MunicipalityStatus;
}

function buildError(message: string, statusCode: number): Error {
    return Object.assign(new Error(message), { statusCode });
}

export class MunicipalityService {

    static async getMunicipalities(params: GetMunicipalitiesParams) {

        if (params.status && !VALID_STATUSES.includes(params.status as MunicipalityStatus)) {
            throw buildError("El status debe ser 'active' o 'inactive'", 400);
        }

        if (params.districtId && !ObjectId.isValid(params.districtId)) {
            throw buildError("El districtId no es un ObjectId válido", 400);
        }

        return await MunicipalityRepository.getMunicipalities({
            status: params.status as MunicipalityStatus | undefined,
            districtId: params.districtId,
        });
    }
    static async getMunicipalityById(id: string) {

        if (!ObjectId.isValid(id)) {
            throw buildError("El id no es un ObjectId válido", 400);
        }

        const municipality = await MunicipalityRepository.getMunicipalityById(id);

        if (!municipality) {
            throw buildError("Municipalidad no encontrada", 404);
        }

        return municipality;
    }

    static async createMunicipality(params: CreateMunicipalityParams) {

        if (!params.name || params.name.trim() === "") {
            throw buildError("El nombre es requerido", 400);
        }

        const existingMunicipality = await MunicipalityRepository.getMunicipalityByName(params.name.trim());
        if (existingMunicipality) {
            throw buildError("Ya existe una municipalidad con ese nombre", 409);
        }

        if (!params.districtId || !ObjectId.isValid(params.districtId)) {
            throw buildError("El districtId es requerido y debe ser un ObjectId válido", 400);
        }

        if (params.status && !VALID_STATUSES.includes(params.status)) {
            throw buildError("El status debe ser 'active' o 'inactive'", 400);
        }

        const now = new Date();

        return await MunicipalityRepository.createMunicipality({
            name: params.name.trim(),
            districtId: new ObjectId(params.districtId),
            status: params.status ?? "active",
            createdAt: now,
            updatedAt: now,
        });
    }
    
    static async updateMunicipality(id: string, params: UpdateMunicipalityParams) {

        if (!ObjectId.isValid(id)) {
            throw buildError("El id no es un ObjectId válido", 400);
        }

        if (Object.keys(params).length === 0) {
            throw buildError("Debe enviar al menos un campo para actualizar", 400);
        }

        if (params.name !== undefined && params.name.trim() === "") {
            throw buildError("El nombre no puede estar vacío", 400);
        }

        if (params.districtId !== undefined && !ObjectId.isValid(params.districtId)) {
            throw buildError("El districtId no es un ObjectId válido", 400);
        }

        if (params.status !== undefined && !VALID_STATUSES.includes(params.status)) {
            throw buildError("El status debe ser 'active' o 'inactive'", 400);
        }

        const updateData: {
            name?: string;
            districtId?: ObjectId;
            status?: MunicipalityStatus;
        } = {};

        if (params.name) updateData.name = params.name.trim();
        if (params.districtId) updateData.districtId = new ObjectId(params.districtId);
        if (params.status) updateData.status = params.status;

        const updated = await MunicipalityRepository.updateMunicipality(id, updateData);

        if (!updated) {
            throw buildError("Municipalidad no encontrada", 404);
        }

        return updated;
    }
}