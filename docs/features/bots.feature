Feature: Rule-Based Bots
  As a game engine
  I need AI bots with different difficulty levels
  So that players can practice and games can be simulated

  Background:
    Given a game with 4 players
    And the game has been initialized with seed 12345

  @bots @interface
  Scenario: Bot implements required interface
    Given a RuleBot with "Normal" difficulty
    Then the bot should implement chooseMove method
    And the bot should implement shouldChallenge method
    And the bot should implement onEvent method

  @bots @observation
  Scenario: Bot receives only observation
    Given a RuleBot is registered for player 2
    When player 2 needs to make a move
    Then the bot's chooseMove should receive a PlayerObservation
    And the bot should not have access to hidden cards

  @bots @move
  Scenario: Bot chooses valid moves
    Given a RuleBot with "Normal" difficulty for player 1
    And player 1 has cards "7♥, 7♦, 5♣, 9♠, K♥"
    And the last claim was rank "5"
    When the bot chooses a move
    Then the move should have a valid claim rank >= "5"
    And the move should play cards from the bot's hand

  @bots @honest
  Scenario: Easy bot plays mostly honest
    Given a RuleBot with "Easy" difficulty
    And bluffRate is 0.05
    When the bot makes 100 moves
    Then approximately 95% should be honest moves
    And honest moves play cards matching claimed rank

  @bots @bluff
  Scenario: Pro bot bluffs more often
    Given a RuleBot with "Pro" difficulty
    And bluffRate is 0.45
    When the bot makes 100 moves
    Then approximately 45% may be bluff moves
    And bluff moves may not match claimed rank

  @bots @challenge
  Scenario: Bot challenges based on suspicion score
    Given a RuleBot with "Normal" difficulty
    And challengeThreshold is 2.7
    When another player claims rank "10"
    And suspicion score is calculated as 3.0
    Then the bot should challenge

  @bots @challenge @certain
  Scenario: Bot always challenges when holding all cards of claimed rank
    Given a RuleBot for player 2
    And player 2 holds all four "7" cards
    When player 1 claims rank "7"
    Then the bot should always challenge
    And the suspicion score should be infinity

  @bots @challenge @ten-ace
  Scenario: Bot increases suspicion for 10 and A claims
    Given a RuleBot with "Normal" difficulty
    When player 1 claims rank "10" with count 2
    Then suspicion score should include +2.0 for burn claim

  @bots @challenge @four-in-row
  Scenario: Bot increases suspicion for potential four-in-row
    Given a RuleBot with "Normal" difficulty
    And the claim history has 3 consecutive "7" claims
    When player 1 claims rank "7"
    Then suspicion score should include +1.5 for four-in-row trigger

  @bots @memory
  Scenario: Bot tracks player reputation
    Given a RuleBot with memory level 2
    And player 3 has been caught lying 5 times out of 10 challenges
    When player 3 makes a claim
    Then the bot's suspicion should include reputation factor
    And caughtLieRate for player 3 should be approximately 0.5

  @bots @memory @update
  Scenario: Bot updates reputation on challenge resolution
    Given a RuleBot with memory level 2
    When a CHALLENGE_RESOLVED event occurs with wasLie=true for player 3
    Then the bot should increase caughtLieRate for player 3

  @bots @endgame
  Scenario: Bot is more aggressive in endgame
    Given a RuleBot with "Hard" difficulty
    And endgameAggro is 0.9
    And the draw pile is empty
    When player 1 has only 2 cards
    And player 1 makes a claim
    Then the bot should apply endgame aggression modifier
    And challenge threshold should be effectively lowered

  @bots @burn-bluff
  Scenario: Pro bot attempts burn bluffs on large piles
    Given a RuleBot with "Pro" difficulty
    And burnBluffRate is 0.25
    And the table pile has 15 cards
    When the bot considers moves
    Then burn bluff (claiming 10 or A) should be a candidate
    And burn bluff probability should be based on burnBluffRate

  @bots @pile-fear
  Scenario: Bot considers pile size when challenging
    Given a RuleBot with pileFearFactor of 1.0
    And the table pile has 20 cards
    When calculating challenge suspicion
    Then the pile fear should reduce willingness to challenge
    And suspicion should be reduced by log(1 + 20) * pileFearFactor

  @bots @presets
  Scenario Outline: Difficulty presets have correct parameters
    Given a RuleBot with "<difficulty>" difficulty
    Then bluffRate should be <bluff_rate>
    And burnBluffRate should be <burn_bluff_rate>
    And challengeThreshold should be <challenge_threshold>
    And pileFearFactor should be <pile_fear>
    And endgameAggro should be <endgame_aggro>
    And memoryLevel should be <memory>

    Examples:
      | difficulty | bluff_rate | burn_bluff_rate | challenge_threshold | pile_fear | endgame_aggro | memory |
      | Easy       | 0.05       | 0.00            | 3.4                 | 1.2       | 0.3           | 0      |
      | Normal     | 0.20       | 0.05            | 2.7                 | 1.0       | 0.6           | 1      |
      | Hard       | 0.35       | 0.15            | 2.2                 | 0.8       | 0.9           | 2      |
      | Pro        | 0.45       | 0.25            | 1.9                 | 0.7       | 1.2           | 2      |

  @bots @determinism
  Scenario: Bot decisions are deterministic with same RNG seed
    Given a game with seed 42
    And all players are RuleBots with "Normal" difficulty
    When the full game is played
    And the game is replayed with seed 42
    Then all bot decisions should be identical
    And the game outcome should be identical



