import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { 
  CreateProjectUseCase, 
  ListProjectsUseCase, 
  GetProjectUseCase, 
  DeleteProjectUseCase,
  ProjectRepository,
  UnitOfWork
} from '@taleorience/application';
import { PROJECT_REPOSITORY, UNIT_OF_WORK } from '../tokens';

@Module({
  controllers: [ProjectsController],
  providers: [
    {
      provide: CreateProjectUseCase,
      useFactory: (repo: ProjectRepository, uow: UnitOfWork) => new CreateProjectUseCase(repo, uow),
      inject: [PROJECT_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: ListProjectsUseCase,
      useFactory: (repo: ProjectRepository) => new ListProjectsUseCase(repo),
      inject: [PROJECT_REPOSITORY],
    },
    {
      provide: GetProjectUseCase,
      useFactory: (repo: ProjectRepository) => new GetProjectUseCase(repo),
      inject: [PROJECT_REPOSITORY],
    },
    {
      provide: DeleteProjectUseCase,
      useFactory: (repo: ProjectRepository, uow: UnitOfWork) => new DeleteProjectUseCase(repo, uow),
      inject: [PROJECT_REPOSITORY, UNIT_OF_WORK],
    },
  ],
})
export class ProjectsModule {}