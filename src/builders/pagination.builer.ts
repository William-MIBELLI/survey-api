import { PaginationInput } from "generated/graphql";


export default abstract class PaginationBuilder {

  private args: PaginationInput

  constructor(args: PaginationInput) {
    this.args = args
    this.build()
  }

  public build() {
    
  }
}