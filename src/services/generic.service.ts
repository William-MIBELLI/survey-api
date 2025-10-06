import { appDataSource } from "lib/datasource";
import GenericRepository from "repositories/generic.repo";
import { DeepPartial, EntityTarget, ObjectLiteral, Repository } from "typeorm";


export default abstract class GenericService<T extends ObjectLiteral> {

  protected repo: Repository<T>

  constructor(entity: EntityTarget<T>) {
    // this.repo = appDataSource.getRepository(entity)
    this.repo = new GenericRepository<T>().getInstance(entity)
  }

  // protected getPagination(pagination?: PaginationInput) {
  //   const created = pagination?.created ?? new Date(1970, 1, 1);
  //   const limit = pagination?.limit || 20;
  //   const order: Order = pagination?.order || Order.Asc
  //   return { created, limit, order };
  // }

  //CREER UNE INSTANCE DE T
  public async createOne(entity: DeepPartial<T>) {
    const created = await this.repo.save(this.repo.create(entity));
    //ON RECHERCHE AVEC UN FIND POUR RECUPERER LES RELATIONS EN MEME TEMPS
    const finded = await this.repo.findOne({ where: { id: created.id } });
    if (!finded) {
      throw new Error("Impossible de créer l'entité");
    }

    return finded;
  }

  // //RECUPERER TOUTES LES INSTANCES
  // public async findAll(pag?: PaginationInput) {
  //   const { created, limit, order } = this.getPagination(pag);
  //   const list = await this.repo.find({
  //     where: {
  //       createdAt: Raw((alias) => `${alias} >= :created`, { created }),
  //     } as any,
  //     order: {
  //       createdAt: order,
  //     } as any,
  //     take: limit,
  //   });

  //   return list;
  // }

  //RECUPERER UNE INSTANCE VIA SON ID
  public async findById(id: string) {
    const ad = await this.repo.findOne({
      where: {
        id,
      } as any,
    });

    return ad;
  }


  // //RECUPERER VIA PLUSIEURS PROPRIETES
  // public async findByProperties(
  //   fields: FindOptionsWhere<T>,
  //   pag?: PaginationInput
  // ): Promise<T[]> {
  //   const { created, limit, order } = this.getPagination(pag);
  //   return await this.repo.find({
  //     where: {
  //       ...fields,
  //       createdAt: Raw((alias) => `${alias} >= :created`, { created }),
  //     } as any,
  //     take: limit,
  //     order: {
  //       createdAt: order,
  //     } as any,
  //   });
  // }

  // //RECUPERER ENTRE 2 DATES DE CREATION
  // public async findByCreationSlot(data: ByCreationSlotInput): Promise<T[]> {
  //   const { start, end, name, pagination } = data;
  
  //   const startDate = pagination?.created || start

  //   const result = await this.repo
  //     .createQueryBuilder(name)
  //     .where(`${name}.createdAt >= :start`, { start: new Date(startDate) })
  //     .andWhere(`${name}.createdAt <= :end`, { end: new Date(end) })
  //     .orderBy(`${name}.createdAt `, pagination?.order || "ASC")
  //     .limit(pagination?.limit || 20)
  //     .getMany();

  //   return result;
  // }

  //DELETE
  public async deleteOne(id: string): Promise<boolean> {
    const deleted = await this.repo.delete({ id: id as any });
    if (!deleted.affected || deleted.affected === 0) {
      return false;
    }
    return true;
  }

  //UPDATE
  public async updateOne(id: string, entity: Partial<T>): Promise<T | null> {
    const updated = await this.repo.update(id, entity);
    if (!updated) {
      throw new Error("Nothing affected.");
    }
    const updatedEntity = await this.findById(id);

    if (!updatedEntity) {
      throw new Error("Entity not found after update");
    }
    return updatedEntity;
  }
} 