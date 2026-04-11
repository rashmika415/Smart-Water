jest.mock("../../../models/userModel", () => ({
  find: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

const User = require("../../../models/userModel");
const bcrypt = require("bcryptjs");
const userController = require("../../../controllers/userController");

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("userController unit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllUsers", () => {
    it("returns users without passwords", async () => {
      const users = [{ _id: "u1", name: "A", email: "a@test.com", role: "user" }];
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(users),
      });

      const req = {};
      const res = createMockRes();
      await userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(users);
    });
  });

  describe("getUserById", () => {
    it("returns 400 for invalid user id", async () => {
      const req = { params: { id: "invalid-id" } };
      const res = createMockRes();

      await userController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
    });
  });

  describe("updateUser", () => {
    it("updates fields and hashes password when provided", async () => {
      const savedUser = {
        _id: "507f1f77bcf86cd799439011",
        name: "old",
        email: "old@test.com",
        role: "user",
        password: "oldhash",
        save: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          name: "new-name",
          email: "new@test.com",
          role: "admin",
        }),
      };

      User.findById.mockResolvedValue(savedUser);
      bcrypt.genSalt.mockResolvedValue("salt");
      bcrypt.hash.mockResolvedValue("hashed-pass");

      const req = {
        params: { id: "507f1f77bcf86cd799439011" },
        body: {
          name: "new-name",
          email: "new@test.com",
          role: "admin",
          password: "newpass123",
        },
      };
      const res = createMockRes();

      await userController.updateUser(req, res);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith("newpass123", "salt");
      expect(savedUser.password).toBe("hashed-pass");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User updated successfully",
          user: expect.objectContaining({
            name: "new-name",
            email: "new@test.com",
            role: "admin",
          }),
        })
      );
    });
  });

  describe("deleteUser", () => {
    it("returns 404 when user not found", async () => {
      User.findById.mockResolvedValue(null);

      const req = { params: { id: "507f1f77bcf86cd799439011" } };
      const res = createMockRes();
      await userController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });
  });
});

