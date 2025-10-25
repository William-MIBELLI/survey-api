import UserEntity from "entities/user.entity";
import GenericQUeryBuilder, { TFilterHandler } from "./generic.builder";

export default class UserQueryBuilder extends GenericQUeryBuilder<UserEntity> {
  protected filterHandlers: Map<string, TFilterHandler<UserEntity>> = new Map();

  constructor() {
    super(UserEntity);
    this.initialiseFilters();
  }

  protected initialiseFilters() {
    this.metadata.columns.forEach((column) => {
      
      if (column.type === String || column.type === "varchar" || column.type === "text") {
        this.filterHandlers.set(column.propertyName, this.applyStringFilter);
      } else {
        this.filterHandlers.set(column.propertyName, this.applyComparisonFilter);
      }
    });

  }
}
