const express = require("express");
const bodyParser = require("body-parser");
const config = require("./config");
const routes = require("./routes");
const passport = require("passport");
const dotenv = require("dotenv");
const cors = require("cors");

const jwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("./models/User");
const healthRoutes = require("./routes/healthRoutes"); // Include the health check route

dotenv.config();

const app = express();

// Middleware
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: false,
  optionSuccessStatus: 200
  }
  app.use(cors(corsOptions));
app.use(bodyParser.json());

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
};

passport.use(
  new jwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.user.id);

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Routes
app.use("/api", routes);
app.use("/health", healthRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => config.logger.info(`Server is running on port ${PORT}`));
