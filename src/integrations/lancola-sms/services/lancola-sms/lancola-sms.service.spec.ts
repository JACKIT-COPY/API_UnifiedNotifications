import { Test, TestingModule } from '@nestjs/testing';
import { LancolaSmsService } from './lancola-sms.service';

describe('LancolaSmsService', () => {
  let service: LancolaSmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LancolaSmsService],
    }).compile();

    service = module.get<LancolaSmsService>(LancolaSmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
