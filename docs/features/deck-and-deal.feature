Feature: Deck and Deal
  As a game engine
  I need to properly create and deal cards
  So that the game starts in a valid state

  Background:
    Given a standard 52-card deck without jokers

  @setup
  Scenario: Creating a new deck
    When I create a new deck
    Then the deck should have 52 cards
    And the deck should have 4 suits
    And each suit should have 13 cards
    And the suits should be "hearts", "diamonds", "clubs", "spades"
    And each suit should have ranks "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"

  @setup
  Scenario Outline: Dealing cards for different player counts
    Given a game with <player_count> players
    And a seeded random number generator with seed 12345
    When the game is initialized
    Then each player should have 5 cards in hand
    And the draw pile should have <draw_pile_size> cards
    And the table pile should be empty
    And the burn pile should be empty

    Examples:
      | player_count | draw_pile_size |
      | 3            | 37             |
      | 4            | 32             |
      | 5            | 27             |
      | 6            | 22             |

  @setup @determinism
  Scenario: Shuffling is deterministic with same seed
    Given a seeded random number generator with seed 42
    When I shuffle the deck
    And I record the card order as "first_shuffle"
    And I reset the random number generator with seed 42
    And I shuffle the deck again
    And I record the card order as "second_shuffle"
    Then "first_shuffle" should equal "second_shuffle"

  @setup @determinism
  Scenario: Different seeds produce different shuffles
    Given a seeded random number generator with seed 42
    When I shuffle the deck
    And I record the card order as "first_shuffle"
    And I reset the random number generator with seed 99
    And I shuffle the deck again
    And I record the card order as "second_shuffle"
    Then "first_shuffle" should not equal "second_shuffle"

  @validation
  Scenario: Invalid player count - too few
    Given a game configuration with 2 players
    When I try to initialize the game
    Then the game should reject with error "Player count must be between 3 and 6"

  @validation
  Scenario: Invalid player count - too many
    Given a game configuration with 7 players
    When I try to initialize the game
    Then the game should reject with error "Player count must be between 3 and 6"

