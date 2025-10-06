import { appDataSource } from "../lib/datasource"
import { EntityTarget, ObjectLiteral, Repository } from "typeorm"


export default class GenericRepository<T extends ObjectLiteral> {

  private  repo: Repository<T>  | null = null

  public getInstance(entity: EntityTarget<T>): Repository<T> {
    if (!this.repo) {
      this.repo = appDataSource.getRepository(entity)
    }
    return this.repo
  }

}