Feature: Game Events
  As a game engine
  I need to emit events for all game actions
  So that UI and tests can track game state changes

  Background:
    Given a game with 4 players
    And the game has been initialized with seed 12345

  @events
  Scenario: PLAY_MADE event emitted when cards played
    When player 1 plays 2 cards claiming rank "7"
    Then an event "PLAY_MADE" should be emitted
    And the event should contain:
      | field      | value   |
      | playerId   | player1 |
      | claimRank  | 7       |
      | claimCount | 2       |
      | cardCount  | 2       |

  @events
  Scenario: CHALLENGE_OFFERED event emitted after play
    When player 1 plays 2 cards claiming rank "7"
    Then an event "CHALLENGE_OFFERED" should be emitted
    And the event should indicate challenge window is open

  @events
  Scenario: CHALLENGE_DECLARED event emitted when challenged
    Given player 1 has played cards claiming rank "7"
    When player 2 declares a challenge
    Then an event "CHALLENGE_DECLARED" should be emitted
    And the event should contain:
      | field        | value   |
      | challengerId | player2 |
      | accusedId    | player1 |

  @events
  Scenario: CHALLENGE_RESOLVED event with lie result
    Given player 1 plays 2 cards "3♥, 4♦" claiming rank "7"
    When player 2 challenges
    Then an event "CHALLENGE_RESOLVED" should be emitted
    And the event should contain:
      | field         | value   |
      | wasLie        | true    |
      | accusedId     | player1 |
      | challengerId  | player2 |
      | revealedCards | 3♥, 4♦  |

  @events
  Scenario: CHALLENGE_RESOLVED event with true result
    Given player 1 plays 2 cards "7♥, 7♦" claiming rank "7"
    When player 2 challenges
    Then an event "CHALLENGE_RESOLVED" should be emitted
    And the event should contain:
      | field        | value   |
      | wasLie       | false   |
      | accusedId    | player1 |
      | challengerId | player2 |

  @events
  Scenario: PILE_BURNED event for 10
    When player 1 plays cards claiming rank "10"
    And no player challenges
    Then an event "PILE_BURNED" should be emitted
    And the event should contain:
      | field  | value |
      | reason | TEN   |

  @events
  Scenario: PILE_BURNED event for Ace
    When player 1 plays cards claiming rank "A"
    And no player challenges
    Then an event "PILE_BURNED" should be emitted
    And the event should contain:
      | field  | value |
      | reason | ACE   |

  @events
  Scenario: PILE_BURNED event for four in row
    Given the claim history has 3 consecutive "7" claims
    When player 4 plays cards claiming rank "7"
    And no player challenges
    Then an event "PILE_BURNED" should be emitted
    And the event should contain:
      | field  | value       |
      | reason | FOUR_IN_ROW |

  @events
  Scenario: CARDS_DRAWN event when player draws
    Given player 1 has played 2 cards
    And no player challenges
    When hand replenishment occurs
    Then an event "CARDS_DRAWN" should be emitted
    And the event should contain the number of cards drawn

  @events
  Scenario: TURN_ADVANCED event when turn changes
    Given player 1 has completed their turn
    When the turn advances
    Then an event "TURN_ADVANCED" should be emitted
    And the event should contain:
      | field           | value   |
      | previousPlayer  | player1 |
      | currentPlayer   | player2 |

  @events
  Scenario: PLAYER_WON event when game ends
    Given the draw pile is empty
    And player 1 has 2 cards
    When player 1 plays 2 cards with valid claim
    And no player challenges
    Then an event "PLAYER_WON" should be emitted
    And the event should contain:
      | field    | value   |
      | winnerId | player1 |

  @events @determinism
  Scenario: Event log is complete and deterministic
    Given a game with seed 12345
    When the entire game is played with bots
    And the game is replayed with seed 12345
    Then the event logs should be identical
    And every game action should be logged

