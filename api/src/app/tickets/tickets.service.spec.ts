import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketError } from './ticket-errors';
import { TicketsService } from './tickets.service';

const OWNER = BigInt(1);
const HOUSE = BigInt(7);

describe('TicketsService', () => {
  const prismaMock = {
    ticket: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    house: {
      findFirst: jest.fn(),
    },
  };
  let service: TicketsService;

  const ownHouse = () =>
    prismaMock.house.findFirst.mockResolvedValue({ id: HOUSE });

  beforeEach(() => {
    jest.resetAllMocks();
    service = new TicketsService(prismaMock as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a ticket for the owner with trimmed fields and defaults (FR-TICKET-01)', async () => {
      ownHouse();
      prismaMock.ticket.create.mockResolvedValue({});
      await service.create(OWNER, {
        houseId: 7,
        title: '  Тече кран  ',
        category: 'PLUMBING',
        requesterName: ' Іван ',
      });
      expect(prismaMock.house.findFirst).toHaveBeenCalledWith({
        where: { id: HOUSE, userId: OWNER },
        select: { id: true },
      });
      expect(prismaMock.ticket.create).toHaveBeenCalledWith({
        data: {
          userId: OWNER,
          houseId: HOUSE,
          title: 'Тече кран',
          description: null,
          category: 'PLUMBING',
          requesterName: 'Іван',
          requesterPhone: null,
          executor: null,
          dueDate: null,
          // no priority key: the schema default NORMAL applies (PRD §5.3)
        },
        include: { house: true },
      });
    });

    it('stores an explicit priority and a parsed due date', async () => {
      ownHouse();
      prismaMock.ticket.create.mockResolvedValue({});
      await service.create(OWNER, {
        houseId: 7,
        title: 'Ліфт',
        category: 'ELEVATOR',
        priority: 'EMERGENCY',
        dueDate: '2026-07-15',
      });
      const data = prismaMock.ticket.create.mock.calls[0][0].data;
      expect(data.priority).toBe('EMERGENCY');
      expect(data.dueDate).toEqual(new Date('2026-07-15'));
    });

    it.each([undefined, '', '   ', 42])(
      'rejects invalid title %p with TICKET_TITLE_INVALID and creates nothing',
      async (title) => {
        ownHouse();
        await expect(
          service.create(OWNER, { houseId: 7, title, category: 'OTHER' }),
        ).rejects.toMatchObject({
          response: { code: 'TICKET_TITLE_INVALID' },
        });
        expect(prismaMock.ticket.create).not.toHaveBeenCalled();
      },
    );

    it('rejects a missing or malformed houseId as a 400 shape error', async () => {
      for (const houseId of [undefined, 'x', -1, 1.5]) {
        const err = await service
          .create(OWNER, { houseId, title: 'Т', category: 'OTHER' })
          .catch((e) => e);
        expect(err).toBeInstanceOf(TicketError);
        expect(err.getStatus()).toBe(400);
        expect(err.getResponse()).toMatchObject({
          code: 'TICKET_HOUSE_INVALID',
        });
      }
      expect(prismaMock.house.findFirst).not.toHaveBeenCalled();
    });

    it('answers the same 404 for a foreign and a missing house (FR-ACCESS-01)', async () => {
      prismaMock.house.findFirst.mockResolvedValue(null); // foreign or missing
      const err = await service
        .create(OWNER, { houseId: 7, title: 'Т', category: 'OTHER' })
        .catch((e) => e);
      expect(err).toBeInstanceOf(TicketError);
      expect(err.getStatus()).toBe(404);
      expect(err.getResponse()).toMatchObject({
        code: 'TICKET_HOUSE_NOT_FOUND',
      });
      expect(prismaMock.ticket.create).not.toHaveBeenCalled();
    });

    it.each(['SOMETHING', '', 5, undefined])(
      'rejects invalid category %p',
      async (category) => {
        ownHouse();
        await expect(
          service.create(OWNER, { houseId: 7, title: 'Т', category }),
        ).rejects.toMatchObject({
          response: { code: 'TICKET_CATEGORY_INVALID' },
        });
      },
    );

    it('rejects an unknown priority', async () => {
      ownHouse();
      await expect(
        service.create(OWNER, {
          houseId: 7,
          title: 'Т',
          category: 'OTHER',
          priority: 'URGENT',
        }),
      ).rejects.toMatchObject({
        response: { code: 'TICKET_PRIORITY_INVALID' },
      });
    });

    it.each(['15.07.2026', '2026-13-40', '2026-02-31', 20260715])(
      'rejects invalid due date %p',
      async (dueDate) => {
        ownHouse();
        await expect(
          service.create(OWNER, {
            houseId: 7,
            title: 'Т',
            category: 'OTHER',
            dueDate,
          }),
        ).rejects.toMatchObject({
          response: { code: 'TICKET_DUE_DATE_INVALID' },
        });
      },
    );

    it('rejects overlong optional texts with their own codes', async () => {
      ownHouse();
      const cases: Array<[string, string, string]> = [
        ['description', 'a'.repeat(10_001), 'TICKET_DESCRIPTION_INVALID'],
        ['requesterName', 'a'.repeat(256), 'TICKET_REQUESTER_INVALID'],
        ['requesterPhone', '1'.repeat(33), 'TICKET_REQUESTER_INVALID'],
        ['executor', 'a'.repeat(256), 'TICKET_EXECUTOR_INVALID'],
      ];
      for (const [field, value, code] of cases) {
        await expect(
          service.create(OWNER, {
            houseId: 7,
            title: 'Т',
            category: 'OTHER',
            [field]: value,
          }),
        ).rejects.toMatchObject({ response: { code } });
      }
    });

    it('maps the FK backstop (P2003) to the house 404', async () => {
      ownHouse(); // race: house deleted after the owner check
      prismaMock.ticket.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('FK constraint', {
          code: 'P2003',
          clientVersion: 'test',
        }),
      );
      await expect(
        service.create(OWNER, { houseId: 7, title: 'Т', category: 'OTHER' }),
      ).rejects.toMatchObject({ response: { code: 'TICKET_HOUSE_NOT_FOUND' } });
    });
  });

  describe('get', () => {
    it('scopes the lookup to id AND owner and joins the house (NFR-SEC-03)', async () => {
      const ticket = { id: BigInt(5) };
      prismaMock.ticket.findFirst.mockResolvedValue(ticket);
      await expect(service.get(OWNER, '5')).resolves.toBe(ticket);
      expect(prismaMock.ticket.findFirst).toHaveBeenCalledWith({
        where: { id: BigInt(5), userId: OWNER },
        include: { house: true },
      });
    });

    it('answers the same 404 for missing and foreign tickets (FR-ACCESS-01)', async () => {
      prismaMock.ticket.findFirst.mockResolvedValue(null); // foreign or missing
      const missing = await service.get(OWNER, '999').catch((e) => e);
      const foreign = await service.get(OWNER, '5').catch((e) => e);
      for (const err of [missing, foreign]) {
        expect(err).toBeInstanceOf(TicketError);
        expect(err.getStatus()).toBe(404);
      }
      expect(missing.getResponse()).toEqual(foreign.getResponse());
    });

    it('treats a non-numeric id as the same 404 without querying', async () => {
      await expect(service.get(OWNER, 'abc')).rejects.toMatchObject({
        response: { code: 'TICKET_NOT_FOUND' },
      });
      expect(prismaMock.ticket.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates only the fields present in the body, atomically with the owner filter', async () => {
      prismaMock.ticket.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.ticket.findFirst.mockResolvedValue({});
      await service.update(OWNER, '5', {
        executor: ' Майстер Петро ',
        dueDate: '2026-07-20',
      });
      expect(prismaMock.ticket.updateMany).toHaveBeenCalledWith({
        where: { id: BigInt(5), userId: OWNER },
        data: {
          executor: 'Майстер Петро',
          dueDate: new Date('2026-07-20'),
        },
      });
      expect(prismaMock.house.findFirst).not.toHaveBeenCalled();
    });

    it('clears the due date on dueDate: null (FR-DUE-01)', async () => {
      prismaMock.ticket.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.ticket.findFirst.mockResolvedValue({});
      await service.update(OWNER, '5', { dueDate: null });
      expect(prismaMock.ticket.updateMany).toHaveBeenCalledWith({
        where: { id: BigInt(5), userId: OWNER },
        data: { dueDate: null },
      });
    });

    it('does not read status from the body (transitions are S-05)', async () => {
      prismaMock.ticket.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.ticket.findFirst.mockResolvedValue({});
      await service.update(OWNER, '5', {
        title: 'Нова назва',
        status: 'CLOSED',
      } as never);
      const data = prismaMock.ticket.updateMany.mock.calls[0][0].data;
      expect(data).toEqual({ title: 'Нова назва' });
    });

    it('re-checks house ownership when houseId changes', async () => {
      prismaMock.house.findFirst.mockResolvedValue(null); // foreign or missing
      await expect(
        service.update(OWNER, '5', { houseId: 7 }),
      ).rejects.toMatchObject({ response: { code: 'TICKET_HOUSE_NOT_FOUND' } });
      expect(prismaMock.ticket.updateMany).not.toHaveBeenCalled();
    });

    it('rejects emptying the title and changes nothing', async () => {
      await expect(
        service.update(OWNER, '5', { title: '  ' }),
      ).rejects.toMatchObject({ response: { code: 'TICKET_TITLE_INVALID' } });
      expect(prismaMock.ticket.updateMany).not.toHaveBeenCalled();
    });

    it('answers 404 when the row is foreign or missing (count 0)', async () => {
      prismaMock.ticket.updateMany.mockResolvedValue({ count: 0 });
      await expect(
        service.update(OWNER, '5', { title: 'Т' }),
      ).rejects.toMatchObject({ response: { code: 'TICKET_NOT_FOUND' } });
    });
  });
});
