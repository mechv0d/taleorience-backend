import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { CreateProjectDtoType } from '@taleorience/contracts';
import {
  CreateProjectUseCase,
  ListProjectsUseCase,
  GetProjectUseCase,
  DeleteProjectUseCase,
} from '@taleorience/application';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly listProjectsUseCase: ListProjectsUseCase,
    private readonly getProjectUseCase: GetProjectUseCase,
    private readonly deleteProjectUseCase: DeleteProjectUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateProjectDtoType) {
    return this.createProjectUseCase.execute(dto.name, dto.description);
  }

  @Get()
  list() {
    return this.listProjectsUseCase.execute();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.getProjectUseCase.execute(id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteProjectUseCase.execute(id);
    return { success: true };
  }
}
