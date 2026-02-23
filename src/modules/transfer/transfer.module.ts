import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
export const TransferModule = () => {
  const transferService = new TransferService();
  const transferController = new TransferController(transferService);

  return { transferController };
}