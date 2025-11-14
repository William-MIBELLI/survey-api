import OptionEntity from "entities/option.entity";
import GenericService from "./generic.service";
import { Repository } from "typeorm";

export default class OptionService extends GenericService<OptionEntity> {
  constructor(repo: Repository<OptionEntity>) {
    super(repo);
  }
}
